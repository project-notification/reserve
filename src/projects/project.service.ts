import * as cheerio from 'cheerio';
import { AIService } from './ai.service';
export class ProjectService {
  private $: cheerio.CheerioAPI;
  private aiService: AIService;
  constructor(html: string) {
    this.$ = cheerio.load(html);
    this.aiService = new AIService();
  }

  getProjects() {
    const recentProjects = this.getRecentProject();
    return recentProjects;
  }

  getRecentProject() {
    const allProjectList = this.$('.question-container');

    const recentProjects = allProjectList.filter((_, element) => {
      const timeText = this.$(element)
        .find('.question__info-detail')
        .children('span')
        .eq(2)
        .text()
        .trim();
      return timeText.includes('분 전');
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

        return {
          title,
          tags,
        };
      })
      .get();
  }

  addTopics(projects: { title: string; tags: string[] }[]) {
    const clonedProjects = projects.map((project) => ({ ...project }));
  }
}
