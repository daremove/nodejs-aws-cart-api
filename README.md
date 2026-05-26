# nodejs-aws-cart-api

NestJS cart service backed by PostgreSQL (RDS) and exposed via API Gateway + Lambda.
The CDK definitions for the database, the Lambda function, and the API Gateway live in the
[sibling `shop-react-redux-cloudfront-be`](../shop-react-redux-cloudfront-be) project
(`lib/cart-database-stack.ts`, `lib/cart-service-stack.ts`).

## Installation

```bash
npm install
```

## Environment

Copy `env.example` to `.env` and adjust the `DB_*` values to point at your local Postgres
(or the RDS endpoint produced by the CDK stack). For a quick local Postgres:

```bash
docker run --name cart-pg -e POSTGRES_USER=cartapi -e POSTGRES_PASSWORD=cartapi \
  -e POSTGRES_DB=cartdb -p 5432:5432 -d postgres:16
```

With `DB_SYNCHRONIZE=true`, TypeORM creates the `carts` and `cart_items` tables on first run.

## Deploy to AWS (via CDK)

```bash
cd ../shop-react-redux-cloudfront-be
npx cdk deploy CartDatabaseStack CartServiceStack --require-approval never
```

The `CartServiceStack` output `CartServiceApiUrl` is the API Gateway endpoint to plug into
the frontend's `VITE_CART_API_PREFIX`.



## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```


## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

### Create user and get auth token

register user with `POST` http://localhost:4000/api/auth/register

Body:
```json
{
  "name": "your_github_login",
  "password": "TEST_PASSWORD"
}
```

**get token** with `POST` http://localhost:4000/api/auth/login

Body
```json
{
  "username": "your_github_login",
  "password": "TEST_PASSWORD"
}
```
Response
```json
{
  "token_type": "Basic",
  "access_token": "eW91ckdpdGh1YkxvZ2luOlRFU1RfUEFTU1dPUkQ="
}

```

**Or you can do it with bash script, make sure you have installed `curl` in your system**

Put content of env.example to .env and **update credentials**:
```bash
cat env.example > .env
```

Create user and get token
```bash
./get-token.sh
```
if command failed make script executable
```bash
chmod +x ./get-token.sh
```

