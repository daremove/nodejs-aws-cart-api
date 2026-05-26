import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartEntity, CartItemEntity, CartStatus } from '../entities';
import { PutCartPayload } from 'src/order/type';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepo: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly itemRepo: Repository<CartItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string): Promise<CartEntity | null> {
    return this.cartRepo.findOne({
      where: { user_id: userId, status: CartStatus.OPEN },
      relations: { items: true },
    });
  }

  async createByUserId(userId: string): Promise<CartEntity> {
    const cart = this.cartRepo.create({
      user_id: userId,
      status: CartStatus.OPEN,
      items: [],
    });
    return this.cartRepo.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<CartEntity> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    return this.createByUserId(userId);
  }

  async updateByUserId(
    userId: string,
    payload: PutCartPayload,
  ): Promise<CartEntity> {
    return this.dataSource.transaction(async (manager) => {
      const cartRepo = manager.getRepository(CartEntity);
      const itemRepo = manager.getRepository(CartItemEntity);

      let cart = await cartRepo.findOne({
        where: { user_id: userId, status: CartStatus.OPEN },
        relations: { items: true },
      });

      if (!cart) {
        cart = await cartRepo.save(
          cartRepo.create({
            user_id: userId,
            status: CartStatus.OPEN,
            items: [],
          }),
        );
      }

      const productId = payload.product.id;
      const existing = await itemRepo.findOne({
        where: { cart_id: cart.id, product_id: productId },
      });

      if (payload.count === 0) {
        if (existing) {
          await itemRepo.remove(existing);
        }
      } else if (existing) {
        existing.count = payload.count;
        await itemRepo.save(existing);
      } else {
        await itemRepo.save(
          itemRepo.create({
            cart_id: cart.id,
            product_id: productId,
            count: payload.count,
          }),
        );
      }

      return cartRepo.findOne({
        where: { id: cart.id },
        relations: { items: true },
      }) as Promise<CartEntity>;
    });
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (!cart) return;
    await this.cartRepo.remove(cart);
  }

  async markOrderedByUserId(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (!cart) return;
    cart.status = CartStatus.ORDERED;
    await this.cartRepo.save(cart);
  }
}
