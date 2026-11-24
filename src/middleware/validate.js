const Joi = require('joi');

const schemas = {
  user: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    role: Joi.string().valid('USER', 'ADMIN')
  }),
  userUpdate: Joi.object({
    email: Joi.string().email(),
    name: Joi.string(),
    role: Joi.string().valid('USER', 'ADMIN')
  }).min(1),
  post: Joi.object({
    title: Joi.string().required(),
    content: Joi.string().allow(null, ''),
    published: Joi.boolean().default(false),
    authorId: Joi.number().integer().required(),
    tags: Joi.array().items(Joi.string()).default([])
  }),
  postUpdate: Joi.object({
    title: Joi.string(),
    content: Joi.string().allow(null, ''),
    published: Joi.boolean(),
    authorId: Joi.number().integer(),
    tags: Joi.array().items(Joi.string())
  }).min(1)
};

const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next(new Error(`Schema ${schemaName} not found`));

  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  req.body = value;
  next();
};

module.exports = { validate };
