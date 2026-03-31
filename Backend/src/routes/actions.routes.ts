import { Router } from "express";
import {
  getActions,
  createAction,
  deleteAction,
} from "../controllers/actions.controller";

const router = Router();

router.get("/", getActions);
router.post("/", createAction);
router.delete("/:id", deleteAction);

export default router;
