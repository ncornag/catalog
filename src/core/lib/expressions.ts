import jsonata, { Expression } from 'jsonata';

export class Expressions {
  private server: any;
  private cache = new Map<string, Expression>();

  constructor(server: any) {
    this.server = server;
  }

  getExpression(expression: string): Expression {
    let compiled: Expression | undefined = this.cache.get(expression);
    if (!compiled) {
      compiled = jsonata(expression);
      this.cache.set(expression, compiled);
      return compiled;
    }
    return compiled;
  }

  public evaluate(expression: string, facts: any, bindings: any) {
    const compiled = this.getExpression(expression);
    return compiled.evaluate(facts, bindings);
  }
}
