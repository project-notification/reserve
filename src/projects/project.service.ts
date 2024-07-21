import * as cheerio from 'cheerio';
import { AIService } from './ai.service';
export class ProjectService {
  private $: cheerio.CheerioAPI;
  private aiService: AIService;
  constructor(html: string) {
    this.$ = cheerio.load(html);
    this.aiService = new AIService();
  }

  async getProjects() {
    const inflearnProjects = this.getInflearnProject();
    return await this.addTopics(inflearnProjects);
  }

  getInflearnProject() {
    const allProjectList = this.$('.question-container');

    const recentProjects = allProjectList.filter((_, element) => {
      const timeText = this.$(element)
        .find('.question__info-detail')
        .children('span')
        .eq(2)
        .text()
        .trim();
      return timeText.includes('2시간 전');
    });

    return recentProjects
      .map((_, element) => {
        const title = this.$(element).find('h3').text().trim();
        const tags = this.$(element)
          .find('span.ac-tag__name')
          .map((_, element) => {
            return this.$(element).text().trim();
          })
          .get();

        const url =
          'https://www.inflearn.com' + this.$(element).find('a').attr('href');

        return {
          title,
          tags,
          url,
        };
      })
      .get();
  }

  async addTopics(projects: { title: string; tags: string[] }[]) {
    const clonedProjects = projects.map((project) => ({ ...project }));
    return Promise.all(
      clonedProjects.map(async (project) => {
        const topics = await this.aiService.askTopics(
          project.title,
          project.tags
        );
        if (topics.length === 0) {
          return {
            ...project,
          };
        }

        return {
          ...project,
          topics,
        };
      })
    );
  }
}
