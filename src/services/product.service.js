"use strict";

const {
  product,
  clothing,
  electronic,
  furniture,
} = require("../models/product.model");
const { BadRequestError, ForbiddenError } = require("../core/error.response");
const {
  findAllDraftsForShop,
  findAllPublishForShop,
  publicProductByShop,
  unPublicProductByShop,
  searchProductByUser
} = require("../models/repositories/product.repo");

class ProductFactory {
  /**
   * type: 'Clothing',..
   * payload
   */
  static async createProduct(type, payload) {
    switch (type) {
      case "Clothing":
        return new Clothing(payload).createProduct();
      case "Electronics":
        return new Electronics(payload).createProduct();
      case "Furniture":
        return new Furniture(payload).createProduct();
      default:
        throw new BadRequestError(`Invalid product types: ${type}`);
    }
  }

  // PUT
  static async publicProductByShop({ product_shop, product_id }) {
    return await publicProductByShop({ product_shop, product_id });
  }

  static async unPublicProductByShop({ product_shop, product_id }) {
    return await unPublicProductByShop({ product_shop, product_id });
  }

  // END PUT

  // QUERY
  static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isDraft: true };
    return await findAllDraftsForShop({ query, limit, skip });
  }

  static async findAllPublishForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isPublished: true };
    return await findAllPublishForShop({ query, limit, skip });
  }

  static async searchProduct({keySearch}) {
    return searchProductByUser({keySearch})
  }
}

class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_quantity,
    product_type,
    product_shop,
    product_attributes,
  }) {
    this.product_name = product_name;
    this.product_thumb = product_thumb;
    this.product_description = product_description;
    this.product_price = product_price;
    this.product_quantity = product_quantity;
    this.product_type = product_type;
    this.product_shop = product_shop;
    this.product_attributes = product_attributes;
  }

  // create new product
  async createProduct(product_id) {
    return await product.create({ ...this, _id: product_id });
  }
}

// define sub-class for different product types: Clothing
class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newClothing) {
      throw new BadRequestError("Create new Clothing error");
    }

    const newProduct = await super.createProduct(newClothing._id);
    if (!newProduct) {
      throw new BadRequestError("Create new Product error");
    }

    console.log(newProduct);
    return newProduct;
  }
}

// define sub-class for different product types: Electronics
class Electronics extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newElectronic) {
      throw new BadRequestError("Create new Electronics error");
    }

    const newProduct = await super.createProduct(newElectronic._id);
    if (!newProduct) {
      throw new BadRequestError("Create new Product error");
    }

    return newProduct;
  }
}

// define sub-class for different product types: Furniture
class Furniture extends Product {
  async createProduct() {
    const newFurniture = await furniture.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newFurniture) {
      throw new BadRequestError("Create new Furniture error");
    }

    const newProduct = await super.createProduct(newFurniture._id);
    if (!newProduct) {
      throw new BadRequestError("Create new Product error");
    }

    return newProduct;
  }
}
module.exports = ProductFactory;
