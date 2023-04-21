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
  searchProductByUser,
  findAllProducts,
  findProduct,
  updateProductById,
} = require("../models/repositories/product.repo");
const { removeUndefinedObject, updateNestedObjectParser } = require("../utils");

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

  static async updateProduct(type, product_id, payload) {
    switch (type) {
      case "Clothing":
        return new Clothing(payload).updateProduct(product_id);
      case "Electronics":
        return new Electronics(payload).updateProduct(product_id);
      case "Furniture":
        return new Furniture(payload).updateProduct(product_id);
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

  static async searchProduct({ keySearch }) {
    return await searchProductByUser({ keySearch });
  }

  static async findAllProducts({
    limit = 50,
    sort = "ctime",
    page = 1,
    filter = { isPublished: true },
  }) {
    return await findAllProducts({
      limit,
      sort,
      page,
      filter,
      select: ["product_name", "product_price", "product_thumb"],
    });
  }

  static async findProduct({ product_id }) {
    return await findProduct({ product_id, unSelect: ["__v"] });
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

  // update product
  async updateProduct(product_id, bodyUpdate) {
    return await updateProductById({ product_id, bodyUpdate, model: product });
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

  async updateProduct(product_id) {
    // 1.  remove attributes have null
    const objectParams = removeUndefinedObject(this);
    // 2. check update product_attributes
    if (objectParams.product_attributes) {
      await updateProductById({
        product_id,
        bodyUpdate: removeUndefinedObject(objectParams.product_attributes),
        model: clothing, // *********
      });
    }
    const updateProduct = await super.updateProduct(
      product_id,
      updateNestedObjectParser(objectParams)
    );
    return updateProduct;
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

  async updateProduct(product_id) {
    // 1.  remove attributes have null
    const objectParams = removeUndefinedObject(this);
    // 2. check update product_attributes
    if (objectParams.product_attributes) {
      await updateProductById({
        product_id,
        bodyUpdate: removeUndefinedObject(objectParams.product_attributes),
        model: electronic, // ********
      });
    }
    const updateProduct = await super.updateProduct(
      product_id,
      updateNestedObjectParser(objectParams)
    );
    return updateProduct;
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

  async updateProduct(product_id) {
    // 1.  remove attributes have null
    const objectParams = removeUndefinedObject(this);
    // 2. check update product_attributes
    if (objectParams.product_attributes) {
      await updateProductById({
        product_id,
        bodyUpdate: removeUndefinedObject(objectParams.product_attributes),
        model: furniture, // *******
      });
    }
    const updateProduct = await super.updateProduct(
      product_id,
      updateNestedObjectParser(objectParams)
    );
    return updateProduct;
  }
}
module.exports = ProductFactory;
