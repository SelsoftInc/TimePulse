'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('account_requests', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'country_code',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('account_requests', 'password_hash');
  },
};
