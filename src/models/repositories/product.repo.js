"use strict";

const { Types } = require("mongoose");
const {
  product,
  clothing,
  furniture,
  electronic,
} = require("../../models/product.model");

const findAllDraftsForShop = async ({ query, limit, skip }) => {
  return await queryProduct({ query, limit, skip });
};

const findAllPublishForShop = async ({ query, limit, skip }) => {
  return await queryProduct({ query, limit, skip });
};

const searchProductByUser = async ({ keySearch }) => {
  const regexSearch = new RegExp(keySearch);
  const results = await product
    .find(
      {
        isPublished: true,
        $text: { $search: regexSearch },
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .lean()
    .exec();
  return results;
};

const queryProduct = async ({ query, limit, skip }) => {
  return await product
    .find(query)
    .populate("product_shop", "name email -_id")
    .sort({ updateAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

const publicProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });
  if (!foundShop) {
    return null;
  }

  foundShop.isDraft = false;
  foundShop.isPublished = true;
  const { modifiedCount } = await foundShop.updateOne(foundShop).exec();

  return modifiedCount;
};

const unPublicProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });
  if (!foundShop) {
    return null;
  }

  foundShop.isDraft = true;
  foundShop.isPublished = false;
  const { modifiedCount } = await foundShop.updateOne(foundShop).exec();

  return modifiedCount;
};

module.exports = {
  findAllDraftsForShop,
  findAllPublishForShop,
  publicProductByShop,
  unPublicProductByShop,
  searchProductByUser,
};
