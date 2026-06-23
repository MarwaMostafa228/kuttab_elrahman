import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import circlesRouter from "./circles";
import memorizationRouter from "./memorization";
import attendanceRouter from "./attendance";
import vacationsRouter from "./vacations";
import guardiansRouter from "./guardians";
import paymentsRouter from "./payments";
import expensesRouter from "./expenses";
import certificatesRouter from "./certificates";
import examsRouter from "./exams";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(circlesRouter);
router.use(memorizationRouter);
router.use(attendanceRouter);
router.use(vacationsRouter);
router.use(guardiansRouter);
router.use(paymentsRouter);
router.use(expensesRouter);
router.use(certificatesRouter);
router.use(examsRouter);
router.use(analyticsRouter);

export default router;
