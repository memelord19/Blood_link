import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import donorsRouter from "./donors";
import appointmentsRouter from "./appointments";
import donationsRouter from "./donations";
import bloodBagsRouter from "./blood_bags";
import stockRouter from "./stock";
import requestsRouter from "./requests";
import alertsRouter from "./alerts";
import invoicesRouter from "./invoices";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import transfusionCentersRouter from "./transfusion_centers";
import establishmentsRouter from "./establishments";
import centersRouter from "./centers";
import bloodBanksRouter from "./blood_banks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(donorsRouter);
router.use(appointmentsRouter);
router.use(donationsRouter);
router.use(bloodBagsRouter);
router.use(stockRouter);
router.use(requestsRouter);
router.use(alertsRouter);
router.use(invoicesRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(transfusionCentersRouter);
router.use(establishmentsRouter);
router.use(centersRouter);
router.use(bloodBanksRouter);

export default router;
