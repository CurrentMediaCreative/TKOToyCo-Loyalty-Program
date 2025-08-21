import Joi from 'joi';
import { 
  validateRequired, 
  validateEmail, 
  validatePhone, 
  validateNumeric, 
  validateShopifyId, 
  validateDateRange,
  type ValidationResult 
} from './errorHandler.server.js';

// Joi schemas for complex validation
const customerSchema = Joi.object({
  shopifyId: Joi.number().integer().positive().required(),
  email: Joi.string().email().optional().allow(null, ''),
  emails: Joi.array().items(Joi.string().email()).optional(),
  firstName: Joi.string().max(255).optional().allow(null, ''),
  lastName: Joi.string().max(255).optional().allow(null, ''),
  phone: Joi.string().max(50).optional().allow(null, ''),
  totalSpend: Joi.number().min(0).optional(),
  numberOfOrders: Joi.number().integer().min(0).optional(),
  spendPoints: Joi.number().min(0).optional(),
  bonusPoints: Joi.number().min(0).optional(),
  totalPoints: Joi.number().min(0).optional(),
  tags: Joi.string().optional().allow(null, ''),
  city: Joi.string().max(255).optional().allow(null, ''),
  province: Joi.string().max(255).optional().allow(null, ''),
  country: Joi.string().max(255).optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
});

const pointEventSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(null, ''),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  eventType: Joi.string().valid('store-wide', 'collection', 'product').required(),
  tags: Joi.string().optional().allow(null, ''),
  collections: Joi.string().optional().allow(null, ''),
  productIds: Joi.string().optional().allow(null, ''),
  channel: Joi.string().valid('online', 'in-store', 'both').default('both'),
  bonusPercentage: Joi.number().min(0).max(1000).required(),
  isActive: Joi.boolean().default(true),
});

const tierSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(null, ''),
  minPoints: Joi.number().min(0).required(),
  maxPoints: Joi.number().min(Joi.ref('minPoints')).optional().allow(null),
});

const orderSchema = Joi.object({
  shopifyId: Joi.number().integer().positive().required(),
  customerId: Joi.string().uuid().optional().allow(null),
  totalAmount: Joi.number().min(0).required(),
  subtotalAmount: Joi.number().min(0).required(),
  taxAmount: Joi.number().min(0).optional(),
  shippingAmount: Joi.number().min(0).optional(),
  discountAmount: Joi.number().min(0).optional(),
  storeCreditUsed: Joi.number().min(0).optional(),
  financialStatus: Joi.string().valid('paid', 'pending', 'refunded', 'partially_paid', 'partially_refunded', 'voided').required(),
  fulfillmentStatus: Joi.string().valid('fulfilled', 'partial', 'unfulfilled').optional().allow(null),
  createdAt: Joi.date().required(),
  processedAt: Joi.date().optional().allow(null),
  fulfilledAt: Joi.date().optional().allow(null),
  orderNumber: Joi.number().integer().positive().required(),
  tags: Joi.string().optional().allow(null, ''),
  note: Joi.string().optional().allow(null, ''),
});

/**
 * Validates customer data
 */
export function validateCustomer(data: any): ValidationResult {
  const { error } = customerSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  // Additional custom validations
  const customErrors: string[] = [];
  
  if (data.email && !validateEmail(data.email)) {
    customErrors.push('Invalid email format');
  }
  
  if (data.emails && Array.isArray(data.emails)) {
    for (const email of data.emails) {
      if (email && !validateEmail(email)) {
        customErrors.push(`Invalid email format in emails array: ${email}`);
      }
    }
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    customErrors.push('Invalid phone number format');
  }
  
  return {
    isValid: customErrors.length === 0,
    errors: customErrors,
    missingFields: [],
  };
}

/**
 * Validates point event data
 */
export function validatePointEvent(data: any): ValidationResult {
  const { error } = pointEventSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  // Additional custom validations
  const customErrors: string[] = [];
  
  // Validate collections JSON if provided
  if (data.collections) {
    try {
      const collections = JSON.parse(data.collections);
      if (!Array.isArray(collections)) {
        customErrors.push('Collections must be a JSON array');
      }
    } catch {
      customErrors.push('Collections must be valid JSON');
    }
  }
  
  // Validate productIds JSON if provided
  if (data.productIds) {
    try {
      const productIds = JSON.parse(data.productIds);
      if (!Array.isArray(productIds)) {
        customErrors.push('Product IDs must be a JSON array');
      } else {
        for (const id of productIds) {
          if (typeof id !== 'number' || id <= 0) {
            customErrors.push('All product IDs must be positive numbers');
            break;
          }
        }
      }
    } catch {
      customErrors.push('Product IDs must be valid JSON');
    }
  }
  
  // Validate event type specific requirements
  if (data.eventType === 'collection' && !data.collections) {
    customErrors.push('Collections are required for collection-type events');
  }
  
  if (data.eventType === 'product' && !data.productIds) {
    customErrors.push('Product IDs are required for product-type events');
  }
  
  return {
    isValid: customErrors.length === 0,
    errors: customErrors,
    missingFields: [],
  };
}

/**
 * Validates tier data
 */
export function validateTier(data: any): ValidationResult {
  const { error } = tierSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  return {
    isValid: true,
    errors: [],
    missingFields: [],
  };
}

/**
 * Validates order data
 */
export function validateOrder(data: any): ValidationResult {
  const { error } = orderSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  // Additional custom validations
  const customErrors: string[] = [];
  
  // Validate that total amount makes sense
  const subtotal = data.subtotalAmount || 0;
  const tax = data.taxAmount || 0;
  const shipping = data.shippingAmount || 0;
  const discount = data.discountAmount || 0;
  const expectedTotal = subtotal + tax + shipping - discount;
  
  if (Math.abs(data.totalAmount - expectedTotal) > 0.01) {
    customErrors.push('Total amount does not match subtotal + tax + shipping - discount');
  }
  
  // Validate store credit doesn't exceed total
  if (data.storeCreditUsed && data.storeCreditUsed > data.totalAmount) {
    customErrors.push('Store credit used cannot exceed total amount');
  }
  
  return {
    isValid: customErrors.length === 0,
    errors: customErrors,
    missingFields: [],
  };
}

/**
 * Validates pagination parameters
 */
export function validatePagination(data: any): ValidationResult {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  });
  
  const { error } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  return {
    isValid: true,
    errors: [],
    missingFields: [],
  };
}

/**
 * Validates search parameters
 */
export function validateSearch(data: any): ValidationResult {
  const schema = Joi.object({
    query: Joi.string().min(1).max(255).optional(),
    filters: Joi.object().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
  });
  
  const { error } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  return {
    isValid: true,
    errors: [],
    missingFields: [],
  };
}

/**
 * Validates webhook payload
 */
export function validateWebhookPayload(data: any, requiredFields: string[]): ValidationResult {
  // First check required fields
  const requiredValidation = validateRequired(data, requiredFields);
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  const customErrors: string[] = [];
  
  // Validate Shopify ID if present
  if (data.id) {
    const idValidation = validateShopifyId(data.id);
    if (!idValidation.isValid) {
      customErrors.push(...idValidation.errors);
    }
  }
  
  // Validate customer ID if present
  if (data.customer?.id) {
    const customerIdValidation = validateShopifyId(data.customer.id);
    if (!customerIdValidation.isValid) {
      customErrors.push('Invalid customer ID');
    }
  }
  
  // Validate dates if present
  if (data.created_at) {
    const date = new Date(data.created_at);
    if (isNaN(date.getTime())) {
      customErrors.push('Invalid created_at date');
    }
  }
  
  if (data.updated_at) {
    const date = new Date(data.updated_at);
    if (isNaN(date.getTime())) {
      customErrors.push('Invalid updated_at date');
    }
  }
  
  return {
    isValid: customErrors.length === 0,
    errors: customErrors,
    missingFields: [],
  };
}

/**
 * Validates JSON string and returns parsed result
 */
export function validateAndParseJson<T>(
  jsonString: string, 
  schema?: Joi.Schema
): { isValid: boolean; data?: T; errors: string[] } {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (schema) {
      const { error } = schema.validate(parsed);
      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message),
        };
      }
    }
    
    return {
      isValid: true,
      data: parsed,
      errors: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid JSON format'],
    };
  }
}

/**
 * Validates array of collections for point events
 */
export function validateCollectionsArray(collections: any): ValidationResult {
  if (!Array.isArray(collections)) {
    return {
      isValid: false,
      errors: ['Collections must be an array'],
      missingFields: [],
    };
  }
  
  const errors: string[] = [];
  
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    if (typeof collection !== 'number' || collection <= 0) {
      errors.push(`Collection at index ${i} must be a positive number`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    missingFields: [],
  };
}

/**
 * Validates array of product IDs for point events
 */
export function validateProductIdsArray(productIds: any): ValidationResult {
  if (!Array.isArray(productIds)) {
    return {
      isValid: false,
      errors: ['Product IDs must be an array'],
      missingFields: [],
    };
  }
  
  const errors: string[] = [];
  
  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    if (typeof productId !== 'number' || productId <= 0) {
      errors.push(`Product ID at index ${i} must be a positive number`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    missingFields: [],
  };
}

/**
 * Validates bulk operation data
 */
export function validateBulkOperation(data: any): ValidationResult {
  const schema = Joi.object({
    operation: Joi.string().valid('create', 'update', 'delete').required(),
    items: Joi.array().min(1).max(1000).required(),
    batchSize: Joi.number().integer().min(1).max(100).default(50),
  });
  
  const { error } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
      missingFields: error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.')),
    };
  }
  
  return {
    isValid: true,
    errors: [],
    missingFields: [],
  };
}

/**
 * Type guards for runtime type checking
 */
export function isCustomerData(data: any): data is {
  shopifyId: number;
  email?: string;
  emails?: string[];
  firstName?: string;
  lastName?: string;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.shopifyId === 'number' &&
    data.shopifyId > 0
  );
}

export function isPointEventData(data: any): data is {
  name: string;
  startDate: Date;
  endDate: Date;
  eventType: string;
  bonusPercentage: number;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    data.startDate instanceof Date &&
    data.endDate instanceof Date &&
    typeof data.eventType === 'string' &&
    typeof data.bonusPercentage === 'number'
  );
}

export function isOrderData(data: any): data is {
  shopifyId: number;
  totalAmount: number;
  financialStatus: string;
  createdAt: Date;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.shopifyId === 'number' &&
    data.shopifyId > 0 &&
    typeof data.totalAmount === 'number' &&
    typeof data.financialStatus === 'string' &&
    data.createdAt instanceof Date
  );
}

export default {
  validateCustomer,
  validatePointEvent,
  validateTier,
  validateOrder,
  validatePagination,
  validateSearch,
  validateWebhookPayload,
  validateAndParseJson,
  validateCollectionsArray,
  validateProductIdsArray,
  validateBulkOperation,
  isCustomerData,
  isPointEventData,
  isOrderData,
};
