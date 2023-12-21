import fetch from 'node-fetch';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { Value } from '@sinclair/typebox/value';

import {
  ClientBuilder,
  // Import middlewares
  type AuthMiddlewareOptions, // Required for auth
  type HttpMiddlewareOptions // Required for sending HTTP requests
} from '@commercetools/sdk-client-v2';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

export class CT {
  private server: any;
  public api: ByProjectKeyRequestBuilder;

  public constructor(server: any) {
    this.server = server;
    this.api = this.apiBuilder();
  }

  private apiBuilder = (): ByProjectKeyRequestBuilder => {
    const {
      CT_AUTHHOST: authHost,
      CT_HTTPHOST: httpHost,
      CT_PROJECTKEY: projectKey,
      CT_SCOPE: [scopes],
      CT_CLIENTID: clientId,
      CT_CLIENTSECRET: clientSecret
    } = this.server.config;

    // Configure authMiddlewareOptions
    const authMiddlewareOptions: AuthMiddlewareOptions = {
      host: `https://${authHost}`,
      projectKey,
      credentials: {
        clientId,
        clientSecret
      },
      scopes,
      fetch
    };

    // Configure httpMiddlewareOptions
    const httpMiddlewareOptions: HttpMiddlewareOptions = {
      host: `https://${httpHost}`,
      fetch
    };

    // Return the ClientBuilder
    const ctpClient = new ClientBuilder()
      //.withProjectKey(projectKey)
      .withClientCredentialsFlow(authMiddlewareOptions)
      .withHttpMiddleware(httpMiddlewareOptions)
      .build();

    return createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });
  };

  public toCTProduct(stagedProduct: any, currentProduct: any): any {
    const sp = this.toCTProductVersion(stagedProduct);
    const cp = currentProduct ? this.toCTProductVersion(currentProduct) : {};
    const hasStagedChanges = Value.Diff(sp, cp).length > 0;
    return {
      id: stagedProduct._id,
      version: stagedProduct.version,
      // versionModifiedAt: '2023-12-18T13:56:59.005Z',
      // lastMessageSequenceNumber: 18,
      // createdAt: '2023-12-07T12:26:42.371Z',
      // lastModifiedAt: '2023-12-18T13:56:59.005Z',
      // lastModifiedBy: {
      //   isPlatformClient: true,
      //   user: {
      //     typeId: 'user',
      //     id: '4ac2f167-af7e-4e7d-9c85-4cf8ee9f1478'
      //   }
      // },
      // createdBy: {
      //   isPlatformClient: true,
      //   user: {
      //     typeId: 'user',
      //     id: '4ac2f167-af7e-4e7d-9c85-4cf8ee9f1478'
      //   }
      // },
      // TODO: Get the first Classification Category of the first Product Category
      productType: {
        id: 'xxx-yyy-zzz',
        typeId: 'product-type'
      },
      createdAt: stagedProduct.createdAt,
      lastModifiedAt: stagedProduct.lastModifiedAt,
      masterData: {
        staged: sp,
        current: cp,
        hasStagedChanges,
        // Unsupported right now, faking data
        published: true
      },
      // Unsupported right now, faking data
      taxCategory: {
        id: 'xxx-yyy-zzz',
        typeId: 'tax-category'
      },
      priceMode: 'Embedded'
    };
  }

  private toCTProductVersion(productVersion: any) {
    return {
      name: productVersion.name,
      categories: productVersion.categories?.map((c: any) => ({ id: c, typeId: 'category' })),
      // Unsupported right now, faking data
      categoryOrderHints: {},
      slug: productVersion.slug,
      description: productVersion.description,
      masterVariant: this.toCTVariant(productVersion.variants[0]),
      variants: productVersion.variants.slice(1).map((v: any) => this.toCTVariant(v)),
      // TODO: Do it right when searchKeywords supports locale, assuming "en"
      searchKeywords: {
        en: (productVersion.searchKeywords ?? []).map((k: any) => {
          return { text: k };
        })
      }
    };
  }

  private groupBy(input: any, key: any) {
    return input.reduce((acc: any, currentValue: any) => {
      let groupKey = key(currentValue);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(currentValue);
      return acc;
    }, {});
  }

  private toCTVariant(variant: any) {
    return {
      id: variant._id,
      sku: variant.sku,
      // Unsupported right now, faking data
      prices: this.toCTPrices(variant.prices),
      // Unsupported right now, faking data
      images: [],
      // TODO: Mix with Base Attributes
      attributes: variant.attributes,
      // Unsupported right now, faking data
      assets: [],
      // Unsupported right now, faking data
      availability: {}
    };
  }

  private ValidFields = ['country', 'customerGroup', 'channel', 'validFrom', 'validUntil', 'minimumQuantity'];

  private toCTPrices(pricesSource: any) {
    const tokenized = pricesSource.map((price: any) => {
      let gkey = '';
      const tokens = [...price.predicate.matchAll(/(\w+[=<>][=<>]?[']?[^']+[']?)(?!: AND)?/g)].map((x: any) => {
        let [key, value] = x[0].split('=');
        if (key === 'date<') key = 'validUntil';
        if (key === 'date>') key = 'validFrom';
        if (key === 'minimumQuantity>') key = 'minimumQuantity';
        value = value.replace(/'/g, '');
        if (!this.ValidFields.includes(key)) throw new Error(`Invalid field: ${key}`);
        if (key != 'minimumQuantity') gkey += `${key}=${value} `;
        return { key, value };
      });
      return { key: gkey.trim(), tokens, price };
    });
    const grouped = this.groupBy(tokenized, (p: any) => p.key);
    const prices = Object.entries(grouped).map(([key, value]: any[]) => {
      const result: any = {};
      value.forEach((price: any) => {
        const qToken = price.tokens.find((t: any) => t.key == 'minimumQuantity');
        if (qToken) {
          if (!result.tiers) result.tiers = [];
          result.tiers.push({ minimumQuantity: new Number(qToken.value), value: price.price.value });
        } else {
          price.tokens.forEach((t: any) => {
            switch (t.key) {
              case 'country':
                result.country = { typeId: 'country', id: t.value };
                break;
              case 'customerGroup':
                result.customerGroup = { typeId: 'customer-group', id: t.value };
                break;
              case 'channel':
                result.channel = { typeId: 'channel', id: t.value };
                break;
              case 'validFrom':
                result.validFrom = t.value;
                break;
              case 'validUntil':
                result.validUntil = t.value;
                break;
            }
          });
          result.value = price.price.value;
          result.id = price.price.id.split('#')[0];
          result.key = price.price.key.split('#')[0];
        }
      });
      return result;
    });
    return prices;
  }
}
