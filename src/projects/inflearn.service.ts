import * as cheerio from 'cheerio';
import { AIService } from './ai.service';
export class InflearnService {
  private aiService: AIService;
  constructor() {
    this.aiService = new AIService();
  }

  async getProjects() {
    const recentProject = await this.getRecentProject();
    return await this.addTopics(recentProject);
  }

  async getRecentProject() {
    const response = await fetch('https://www.inflearn.com/community/projects');
    const html = await response.text();
    const $ = cheerio.load(html);
    const allProjectList = $('.question-container');

    const recentProjects = allProjectList.filter((_, element) => {
      const timeText = $(element)
        .find('.question__info-detail')
        .children('span')
        .eq(2)
        .text()
        .trim();
      return timeText.includes('분 전');
    });

    return recentProjects
      .map((_, element) => {
        const title = $(element).find('h3').text().trim();
        const tags = $(element)
          .find('span.ac-tag__name')
          .map((_, element) => {
            return $(element).text().trim();
          })
          .get();

        const url =
          'https://www.inflearn.com' + $(element).find('a').attr('href');

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
            title: project.title,
          };
        }

        return {
          title: project.title,
          topics,
        };
      })
    );
  }
}
