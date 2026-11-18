import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddPushSubscriptions1731500000000 implements MigrationInterface {
  name = 'AddPushSubscriptions1731500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('push_subscriptions');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'push_subscriptions',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '64',
              isPrimary: true,
            },
            {
              name: 'userId',
              type: 'varchar',
              length: '64',
              isNullable: false,
            },
            {
              name: 'endpoint',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'p256dh',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'auth',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'userAgent',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'push_subscriptions',
        new TableIndex({
          name: 'IDX_push_subscriptions_userId',
          columnNames: ['userId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('push_subscriptions')) {
      await queryRunner.dropTable('push_subscriptions');
    }
  }
}
