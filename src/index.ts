import { InflearnService } from './projects/inflearn.service';
import { HolaService } from './projects/hola.service';
import { ReservationService } from './reservation/reservation.service';

import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const inflearnService = new InflearnService();
  const inflearnProjects = await inflearnService.getProjects();

  const holaService = new HolaService();
  const holaProjects = await holaService.getProjects();

  const allProjects = [...inflearnProjects, ...holaProjects];

  const reservationService = new ReservationService();

  for (const project of allProjects) {
    await reservationService.reserveEmail(project);
  }
}

main();
