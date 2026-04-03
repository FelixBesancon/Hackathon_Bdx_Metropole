import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import type { RegisterPayload, LoginPayload } from "../types/auth";

export async function register(req: Request, res: Response) {
  const payload: RegisterPayload = req.body;

  if (!payload.email || !payload.password || !payload.name) {
    res.status(400).json({ error: "Champs manquants : email, password, name" });
    return;
  }

  try {
    const result = await authService.register(payload);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") {
      res.status(409).json({ error: "Cet email est déjà utilisé" });
    } else {
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  }
}

export async function login(req: Request, res: Response) {
  const payload: LoginPayload = req.body;

  if (!payload.email || !payload.password) {
    res.status(400).json({ error: "Champs manquants : email, password" });
    return;
  }

  try {
    const result = await authService.login(payload);
    res.json(result);
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
    } else {
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  }
}
