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

export const customerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().pattern(/[0-9]{10,11}/),
  cpf: Joi.string().pattern(/[0-9]{11}/),
  birthday: Joi.string().pattern(
    /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/
  ),
});
