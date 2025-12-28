module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('Challenges', 'participantId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Challenges', 'participantId', {
      allowNull: true,
      type: Sequelize.INTEGER,
      onDelete: 'CASCADE',
      references: {
        model: 'Participants',
        key: 'id',
      },
    });
  },
};
