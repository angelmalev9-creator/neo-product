import { describe, expect, it } from 'vitest';
import { buildDeterministicReply } from './deterministicChat';

const knowledge = `
Ти си NEO.
Информация за компанията:
=== Масажи ===
Релаксиращ масаж — 45 € за 60 минути.
Антицелулитен масаж — 50 € за 60 минути.
Работно време: понеделник-петък 09:00-19:00.
Адрес: ул. Примерна 10, София.
Телефон: +359 888 123 456.
`;

describe('buildDeterministicReply', () => {
  it('връща точна цена от knowledge base', () => {
    expect(buildDeterministicReply('Колко струва релаксиращият масаж?', knowledge, 'Salon'))
      .toContain('45 €');
  });

  it('връща работното време', () => {
    expect(buildDeterministicReply('Какво е работното време?', knowledge, 'Salon'))
      .toContain('09:00-19:00');
  });

  it('не измисля отговор при липса на информация', () => {
    expect(buildDeterministicReply('Имате ли сауна?', knowledge, 'Salon'))
      .toContain('Не откривам точна информация');
  });
});
