import Anthropic from '@anthropic-ai/sdk';

export class AIService {
  private anthropic: Anthropic;
  constructor() {
    this.anthropic = new Anthropic();
  }
}
