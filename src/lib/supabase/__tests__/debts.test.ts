import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { generatePaymentSchedule } from '../debts';
import type { DebtFrequency } from '@/lib/types';

describe('Debt Management Functions', () => {
  describe('generatePaymentSchedule', () => {
    it('generates correct daily payment schedule', () => {
      const totalAmount = 1000;
      const installmentAmount = 100;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(10); // 1000 / 100 = 10 installments
      expect(schedule[0].due_date).toBe('2024-01-01');
      expect(schedule[0].amount).toBe(100);
      expect(schedule[0].installment_number).toBe(1);
      
      expect(schedule[1].due_date).toBe('2024-01-02'); // Next day
      expect(schedule[1].amount).toBe(100);
      expect(schedule[1].installment_number).toBe(2);
      
      expect(schedule[9].due_date).toBe('2024-01-10'); // 10th day
      expect(schedule[9].amount).toBe(100);
      expect(schedule[9].installment_number).toBe(10);

      // Verify total amount
      const totalScheduled = schedule.reduce((sum, item) => sum + item.amount, 0);
      expect(totalScheduled).toBe(totalAmount);
    });

    it('generates correct weekly payment schedule', () => {
      const totalAmount = 1000;
      const installmentAmount = 250;
      const frequency: DebtFrequency = 'weekly';
      const startDate = '2024-01-01'; // Monday

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(4); // 1000 / 250 = 4 installments
      expect(schedule[0].due_date).toBe('2024-01-01');
      expect(schedule[0].amount).toBe(250);
      
      expect(schedule[1].due_date).toBe('2024-01-08'); // Next week
      expect(schedule[1].amount).toBe(250);
      
      expect(schedule[2].due_date).toBe('2024-01-15'); // Third week
      expect(schedule[2].amount).toBe(250);
      
      expect(schedule[3].due_date).toBe('2024-01-22'); // Fourth week
      expect(schedule[3].amount).toBe(250);

      // Verify total amount
      const totalScheduled = schedule.reduce((sum, item) => sum + item.amount, 0);
      expect(totalScheduled).toBe(totalAmount);
    });

    it('handles uneven division with remainder in last installment', () => {
      const totalAmount = 1000;
      const installmentAmount = 300;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(4); // 3 full payments + 1 remainder
      expect(schedule[0].amount).toBe(300);
      expect(schedule[1].amount).toBe(300);
      expect(schedule[2].amount).toBe(300);
      expect(schedule[3].amount).toBe(100); // Remainder: 1000 - (3 * 300) = 100

      // Verify total amount
      const totalScheduled = schedule.reduce((sum, item) => sum + item.amount, 0);
      expect(totalScheduled).toBe(totalAmount);
    });

    it('handles single payment when installment equals total', () => {
      const totalAmount = 500;
      const installmentAmount = 500;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].due_date).toBe('2024-01-01');
      expect(schedule[0].amount).toBe(500);
      expect(schedule[0].installment_number).toBe(1);
    });

    it('handles installment larger than total amount', () => {
      const totalAmount = 300;
      const installmentAmount = 500;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].amount).toBe(300); // Should be capped at total amount
      expect(schedule[0].installment_number).toBe(1);
    });

    it('generates correct dates for leap year', () => {
      const totalAmount = 400;
      const installmentAmount = 100;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-02-28'; // 2024 is a leap year

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(4);
      expect(schedule[0].due_date).toBe('2024-02-28');
      expect(schedule[1].due_date).toBe('2024-02-29'); // Leap day
      expect(schedule[2].due_date).toBe('2024-03-01'); // March 1st
      expect(schedule[3].due_date).toBe('2024-03-02');
    });

    it('generates correct dates across month boundaries', () => {
      const totalAmount = 500;
      const installmentAmount = 100;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-30';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(5);
      expect(schedule[0].due_date).toBe('2024-01-30');
      expect(schedule[1].due_date).toBe('2024-01-31');
      expect(schedule[2].due_date).toBe('2024-02-01'); // February 1st
      expect(schedule[3].due_date).toBe('2024-02-02');
      expect(schedule[4].due_date).toBe('2024-02-03');
    });

    it('generates correct weekly dates across month boundaries', () => {
      const totalAmount = 800;
      const installmentAmount = 200;
      const frequency: DebtFrequency = 'weekly';
      const startDate = '2024-01-25'; // Thursday

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(4);
      expect(schedule[0].due_date).toBe('2024-01-25'); // Thursday Jan 25
      expect(schedule[1].due_date).toBe('2024-02-01'); // Thursday Feb 1
      expect(schedule[2].due_date).toBe('2024-02-08'); // Thursday Feb 8
      expect(schedule[3].due_date).toBe('2024-02-15'); // Thursday Feb 15
    });

    it('handles decimal amounts correctly', () => {
      const totalAmount = 1000.50;
      const installmentAmount = 333.50;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(3); // 1000.50 / 333.50 = 3 payments (no remainder)
      expect(schedule[0].amount).toBe(333.50);
      expect(schedule[1].amount).toBe(333.50);
      expect(schedule[2].amount).toBe(333.50);

      // Verify total amount (accounting for floating point precision)
      const totalScheduled = schedule.reduce((sum, item) => sum + item.amount, 0);
      expect(Math.abs(totalScheduled - totalAmount)).toBeLessThan(0.01);
    });

    it('assigns correct installment numbers', () => {
      const totalAmount = 600;
      const installmentAmount = 150;
      const frequency: DebtFrequency = 'weekly';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(4);
      schedule.forEach((item, index) => {
        expect(item.installment_number).toBe(index + 1);
      });
    });

    it('handles very small amounts', () => {
      const totalAmount = 0.50;
      const installmentAmount = 0.25;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(2);
      expect(schedule[0].amount).toBe(0.25);
      expect(schedule[1].amount).toBe(0.25);

      const totalScheduled = schedule.reduce((sum, item) => sum + item.amount, 0);
      expect(totalScheduled).toBe(totalAmount);
    });

    it('handles edge case with zero remainder', () => {
      const totalAmount = 1200;
      const installmentAmount = 400;
      const frequency: DebtFrequency = 'weekly';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(3);
      expect(schedule[0].amount).toBe(400);
      expect(schedule[1].amount).toBe(400);
      expect(schedule[2].amount).toBe(400);

      const totalScheduled = schedule.reduce((sum, item) => sum + item.amount, 0);
      expect(totalScheduled).toBe(totalAmount);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles invalid date format gracefully', () => {
      const totalAmount = 1000;
      const installmentAmount = 100;
      const frequency: DebtFrequency = 'daily';
      const startDate = 'invalid-date';

      // Should not throw an error, but may produce unexpected results
      expect(() => {
        generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);
      }).not.toThrow();
    });

    it('handles zero total amount', () => {
      const totalAmount = 0;
      const installmentAmount = 100;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      const schedule = generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);

      expect(schedule).toHaveLength(0);
    });

    it('handles zero installment amount', () => {
      const totalAmount = 1000;
      const installmentAmount = 0;
      const frequency: DebtFrequency = 'daily';
      const startDate = '2024-01-01';

      // This should be handled by validation in the form, but the function should not crash
      expect(() => {
        generatePaymentSchedule(totalAmount, installmentAmount, frequency, startDate);
      }).not.toThrow();
    });
  });
});