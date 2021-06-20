import Joi from "joi";

export const categoriesSchema = Joi.object({
  name: Joi.string().required(),
});

export const gameSchema = Joi.object({
  name: Joi.string().required(),
  image: Joi.string().pattern(/^http(s|):\/\//),
  stockTotal: Joi.number().min(1).required(),
  categoryId: Joi.number().required(),
  pricePerDay: Joi.number().min(1).required(),
});
