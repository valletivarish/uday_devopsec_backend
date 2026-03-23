/**
 * Customer Model
 *
 * Represents a customer who can place orders. Stores personal details
 * and a default shipping address. Customers are soft-deleted via isActive.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Customer's first name — required, 1-100 characters
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'First name must be between 1 and 100 characters',
        },
      },
    },
    // Customer's last name — required, 1-100 characters
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Last name must be between 1 and 100 characters',
        },
      },
    },
    // Email address — must be unique and valid format
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Email address is already registered',
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address',
        },
      },
    },
    // Optional phone number for contact
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Default shipping address fields — all required for order fulfilment
    shippingStreet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingState: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingPostcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Soft-delete flag: inactive customers cannot place new orders
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'customers',
    timestamps: true,
  });

  return Customer;
};
