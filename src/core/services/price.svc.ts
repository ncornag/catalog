import { nanoid } from 'nanoid';
import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value, type Price } from '@core/entities/price';
import { PriceDAO } from '@infrastructure/repositories/dao/price.dao.schema';
import { IPriceRepository } from '@core/repositories/price.repo';
import { Cart, CartItem, CartProduct } from '@core/entities/cart';
import { IProductService, ProductService } from './product.svc';
import { green, magenta, yellow, gray, reset } from 'kolorist';
import { Expressions } from '@core/lib/expressions';

// SERVICE INTERFACE
export interface IPriceService {
  getPricesForSKU: (catalogId: string, skus: [string]) => Promise<Result<Price[], AppError>>;
  findPriceById: (catalogId: string, id: string) => Promise<Result<Price, AppError>>;
  createCart: (data: any) => Promise<Result<any, AppError>>;
}

const toEntity = ({ _id, ...remainder }: PriceDAO): Price => ({
  id: _id,
  ...remainder
});

export const FieldPredicateOperators: any = {
  country: { operator: 'in', field: 'country', type: 'array' },
  customerGroup: { operator: 'in', field: 'customerGroup', type: 'array', typeId: 'customer-group' },
  channel: { operator: 'in', field: 'channel', type: 'array', typeId: 'channel' },
  validFrom: { operator: '>=', field: 'date', type: 'date' },
  validUntil: { operator: '<=', field: 'date', type: 'date' },
  minimumQuantity: { operator: '>=', field: 'quantity', type: 'number' }
};

export function createPredicateExpression(data: any) {
  const surroundByQuotes = (value: any) => (typeof value === 'string' ? `'${value}'` : value);
  let predicate = Object.entries(data).reduce((acc, [key, value]) => {
    if (acc) acc += ' and ';
    let op = FieldPredicateOperators[key] ? FieldPredicateOperators[key].operator : '=';
    let field = FieldPredicateOperators[key] ? FieldPredicateOperators[key].field : key;
    let val: any = value;
    if (op === 'in') {
      if (!Array.isArray(val)) val = [val];
      if (val.length > 1) acc += '(';
      for (let i = 0; i < val.length; i++) {
        if (i > 0) acc += ' or ';
        acc += `${surroundByQuotes(val[i])} in ${field}`;
      }
      if (val.length > 1) acc += ')';
    } else {
      acc += `${field}${op}${surroundByQuotes(val)}`;
    }
    return acc;
  }, '');
  return predicate === '' ? undefined : predicate;
}

// SERVICE IMPLEMENTATION
export class PriceService implements IPriceService {
  private static instance: IPriceService;
  private repo: IPriceRepository;
  private productService: IProductService;
  private expressions: Expressions;
  private server;

  private constructor(server: any) {
    this.server = server;
    this.repo = server.db.repo.priceRepository as IPriceRepository;
    this.productService = ProductService.getInstance(server);
    this.expressions = new Expressions(server);
  }

  public static getInstance(server: any): IPriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService(server);
    }
    return PriceService.instance;
  }

  public async getPricesForSKU(catalogId: string, skus: string[]): Promise<Result<Price[], AppError>> {
    const result = await this.repo.find(catalogId, { sku: { $in: skus } });
    if (result.err) return result;
    return new Ok(result.val.map((e: PriceDAO) => toEntity(e)));
  }
  public async getCartPricesForSKU(catalogId: string, skus: string[]): Promise<Result<Price[], AppError>> {
    const result = await this.repo.find(
      catalogId,
      {
        sku: { $in: skus },
        active: true,
        $or: [{ 'predicates.constraints.country': 'ES' }, { 'predicates.constraints.country': { $exists: false } }]
      },
      {
        projection: { order: 1, sku: 1, 'predicates.order': 1, 'predicates.vaue': 1, 'predicates.expression': 1 }
      }
    );
    if (result.err) return result;
    console.log(result.val.length);
    return new Ok(result.val.map((e: PriceDAO) => toEntity(e)));
  }

  // FIND PRICE BY ID
  public async findPriceById(catalogId: string, id: string): Promise<Result<Price, AppError>> {
    const result = await this.repo.findOne(catalogId, id);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // CART ENDPOINTS
  private carts = new Map<string, Cart>();

  public async getCart(cartId: string): Promise<Result<Cart, AppError>> {
    const cart = this.carts.get(cartId);
    if (!cart) return new Err(new AppError(ErrorCode.NOT_FOUND, `Cart ${cartId} not found`));
    return new Ok(cart);
  }

  public async addProductToCart(cartId: string, data: any): Promise<Result<Cart, AppError>> {
    const cartResult = await this.getCart(cartId);
    if (cartResult.err) return cartResult;
    const cart = cartResult.val;
    cart.items.push(data);
    return new Ok(cart);
  }

  public async createCart(data: any): Promise<Result<any, AppError>> {
    // TODO Refactor cartData (Lang + Country/CustomerGroup/Channel)
    const cart: Cart = Object.assign(
      { id: nanoid(), items: [] },
      data.country && { country: data.country },
      data.customerGroup && { customerGroup: data.customerGroup },
      data.channel && { channel: data.channel },
      data.lang && { lang: data.lang }
    );

    const facts = Object.assign(
      data.country && { country: data.country },
      data.customerGroup && { customerGroup: data.customerGroup },
      data.channel && { channel: data.channel },
      data.lang && { lang: data.lang }
    );

    // Find Products
    const cartProductsResult = await this.productService.cartProducById(
      'stage',
      data.items.map((item: CartItem) => item.productId),
      data.lang
    );
    if (cartProductsResult.err) return cartProductsResult;
    const cartProducts = cartProductsResult.val;

    // Find Prices
    const pricesResult = await this.getCartPricesForSKU(
      'stage',
      cartProducts.map((cp: CartProduct) => cp.sku)
    );
    if (pricesResult.err) return pricesResult;
    const cartProductPrices = pricesResult.val;

    // Add Products to Cart
    for (let index = 0; index < data.items.length; index++) {
      const cartProduct = cartProducts.find((cp: CartProduct) => cp.productId === data.items[index].productId)!;
      const prices = cartProductPrices
        .filter((p: Price) => p.sku === cartProduct.sku)
        .map((p: Price) => {
          return [
            ...p.predicates.map((pr) => {
              return { porder: p.order, ...pr };
            })
          ];
        })
        .flat()
        .sort((p1: any, p2: any) => (p1.porder - p2.porder === 0 ? p1.order - p2.order : p1.porder - p2.porder));

      // Get Price
      const priceResult = await this.getMatchedPrice(cartProduct.sku, facts, prices);
      if (priceResult.err) return priceResult;
      // Add CartProduct
      cart.items.push({
        productId: cartProduct.productId,
        sku: cartProduct.sku,
        name: cartProduct.name,
        categories: cartProduct.categories,
        quantity: data.items[index].quantity,
        value: priceResult.val
      });
    }
    this.carts.set(cart.id, cart);
    return new Ok(cart);
  }

  private async getMatchedPrice(sku: string, facts: any, prices: any[]): Promise<Result<Value, AppError>> {
    let matchedPrice: number | undefined;
    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];
      if (price.expression) {
        const expressionResult = await this.expressions.evaluate(price.expression, facts, {});
        if (expressionResult !== undefined && typeof expressionResult === 'boolean' && expressionResult === true) {
          matchedPrice = i;
          break;
        }
      } else {
        matchedPrice = i;
        break;
      }
    }
    if (matchedPrice === undefined) return new Err(new AppError(ErrorCode.NOT_FOUND, `Price not found for ${sku}`));
    return new Ok(prices[matchedPrice].value);
  }
}
