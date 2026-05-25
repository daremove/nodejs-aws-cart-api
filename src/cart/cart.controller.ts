import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { BasicAuthGuard } from '../auth';
import { Order, OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { CartService } from './services';
import { CartEntity, CartItemEntity } from './entities';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';

type CartItemResponse = {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
  };
  count: number;
};

const toResponseItems = (cart: CartEntity | null): CartItemResponse[] => {
  if (!cart) return [];
  return (cart.items ?? []).map((item: CartItemEntity) => ({
    product: {
      id: item.product_id,
      title: '',
      description: '',
      price: 0,
    },
    count: item.count,
  }));
};

const calculateCartTotal = (items: CartItemEntity[]): number =>
  items.reduce((acc, item) => acc + item.count, 0);

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest): Promise<CartItemResponse[]> {
    const cart = await this.cartService.findOrCreateByUserId(
      getUserIdFromRequest(req),
    );
    return toResponseItems(cart);
  }

  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<CartItemResponse[]> {
    const cart = await this.cartService.updateByUserId(
      getUserIdFromRequest(req),
      body,
    );
    return toResponseItems(cart);
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(@Req() req: AppRequest): Promise<void> {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));
  }

  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const total = calculateCartTotal(cart.items);
    const order = this.orderService.create({
      userId,
      cartId: cart.id,
      items: cart.items.map((item) => ({
        productId: item.product_id,
        count: item.count,
      })),
      address: body.address,
      total,
    });

    await this.cartService.markOrderedByUserId(userId);

    return { order };
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  getOrder(): Order[] {
    return this.orderService.getAll();
  }
}
