import { ProjectService } from './projects/project.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const response = await fetch('https://www.inflearn.com/community/questions');
  const html = await response.text();

  const projectService = new ProjectService(html);

  const projects = await projectService.getProjects();

  console.log(projects);
}

main();
