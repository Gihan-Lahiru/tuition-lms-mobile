import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMultipleChoiceQuizSupport1731450000000 implements MigrationInterface {
  name = 'AddMultipleChoiceQuizSupport1731450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasQuestionType = await queryRunner.hasColumn('questions', 'questionType');
    if (!hasQuestionType) {
      await queryRunner.addColumn(
        'questions',
        new TableColumn({
          name: 'questionType',
          type: 'varchar',
          length: '32',
          default: "'single_choice'",
        }),
      );
    }

    const hasSelectedOptionIds = await queryRunner.hasColumn(
      'quiz_answers',
      'selectedOptionIds',
    );
    if (!hasSelectedOptionIds) {
      await queryRunner.addColumn(
        'quiz_answers',
        new TableColumn({
          name: 'selectedOptionIds',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('quiz_answers', 'selectedOptionIds')) {
      await queryRunner.dropColumn('quiz_answers', 'selectedOptionIds');
    }
    if (await queryRunner.hasColumn('questions', 'questionType')) {
      await queryRunner.dropColumn('questions', 'questionType');
    }
  }
}

