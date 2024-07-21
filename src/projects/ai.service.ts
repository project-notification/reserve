import Anthropic from '@anthropic-ai/sdk';

export class AIService {
  private anthropic: Anthropic;
  constructor() {
    this.anthropic = new Anthropic();
  }

  async askTopics(title: string, tags: string[]) {
    console.log(`${title}\ntags:${tags.join(',')}`);
    const msg = await this.anthropic.messages.create({
      model: process.env.MODEL!,
      max_tokens: 200,
      temperature: 0,
      system:
        "프로젝트 구인 글의 제목과 태그를 너에게 줄 테니 그 글이 구하고 있는 포지션들을 ',' 표시로 구분된 프론트,백엔드,기획,디자인,마케팅 이 중에서 응답을 보내줘야 해. 하나의 프로젝트 글에서 여러 포지션을 구할 수도 있으니 여러 값이 있을 수도 있지만, 제목이나 태그들에서 구하는 포지션에 대한 정보가 없을 수도 있으니 하나의 값도 없을 수도 있어. 그럴 때나 잘 모를때는 없음 이라고 응답을 보내줘. 또 설명은 절대 하지 않고 그 결과값만을 보내줘.",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${title}\ntags:${tags.join(',')}`,
            },
          ],
        },
      ],
    });

    if (msg.content[0]?.type === 'text') {
      return msg.content[0].text
        .trim()
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '없음');
    } else {
      console.log(msg);
      throw new Error('No text response');
    }
  }
}
