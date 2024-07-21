import { AIService } from './ai.service';
export class HolaService {
  private aiService: AIService;
  constructor() {
    this.aiService = new AIService();
  }

  async getProjects() {
    const recentProject = await this.getRecentProject();
    return await this.addTopics(recentProject);
  }

  async getRecentProject() {
    const response = await fetch(
      'https://api.holaworld.io/api/posts/pagination?page=1&sort=-createdAt&position=ALL&type=1&isClosed=false&onOffLine=ALL'
    );
    const data: { posts: Post[] } = await response.json();
    const posts = data.posts;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000 * 1); // 1시간 전

    const recentProjects = posts.filter((post) => {
      const postDate = new Date(post.createdAt); // ISO 8601 문자열을 Date 객체로 변환
      return postDate > oneHourAgo;
    });

    return recentProjects.map((post) => {
      const title = post.title;
      const tags = post.positions
        .filter((position) => position !== 'ALL')
        .map((position) => {
          if (position === 'FE') {
            return '프론트';
          }
          if (position === 'BE') {
            return '백엔드';
          }
          if (position === 'DE') {
            return '디자인';
          }
          if (position === 'IOS') {
            return 'IOS';
          }
          if (position === 'AND') {
            return '안드로이드';
          }
          if (position === 'PM') {
            return 'PM';
          }
          if (position === 'PD') {
            return '기획';
          }
          if (position === 'MK') {
            return '마케팅';
          }
          return '';
        });

      const url = `https://holaworld.io/study/${post._id}`;

      return {
        title,
        tags,
      };
    });
  }

  addTopics(projects: { title: string; tags: string[] }[]) {
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

type Post = {
  _id: string;
  language: string[];
  isClosed: boolean;
  views: number;
  positions: Position[];
  title: string;
  createdAt: string;
};

type Position = 'FE' | 'BE' | 'DE' | 'IOS' | 'AND' | 'PM' | 'PD' | 'MK' | 'ALL';
