const Joi = require('joi');

// Example schemas - adapt to TBO payloads
const searchSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  departureDate: Joi.string().isoDate().required(),
  returnDate: Joi.string().isoDate().allow('', null),
  passengers: Joi.number().integer().min(1).required()
});

const bookSchema = Joi.object({
  sessionId: Joi.string().required(),
  passengerInfo: Joi.array().items(Joi.object()).min(1).required(),
  contact: Joi.object().required()
});

function validate(schema) {
  return (req, res, next) => {
    const payload = req.method.toLowerCase() === 'get' ? req.query : req.body;
    const { error } = schema.validate(payload, { abortEarly: false, allowUnknown: true });
    if (error) return res.status(400).json({ validation: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { validate, schemas: { searchSchema, bookSchema } };
