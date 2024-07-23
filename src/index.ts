import { InflearnService } from './projects/inflearn.service';
import { HolaService } from './projects/hola.service';
import { ReservationService } from './reservation/reservation.service';
import { Handler } from 'aws-lambda';

export const handler: Handler = async () => {
  const inflearnService = new InflearnService();
  const inflearnProjects = await inflearnService.getProjects();

  const holaService = new HolaService();
  const holaProjects = await holaService.getProjects();

  const allProjects = [...inflearnProjects, ...holaProjects];

  console.log('projects:', allProjects);

  const reservationService = new ReservationService();

  for (const project of allProjects) {
    await reservationService.reserveEmail(project);
  }
};
