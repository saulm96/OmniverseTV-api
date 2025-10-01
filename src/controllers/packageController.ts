import { Request, Response, NextFunction } from 'express';
import * as packageService from '../services/packageService';

export const getAllPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const packages = await packageService.getAllPackages();
    res.status(200).json(packages);
  } catch (error) {
    next(error);
  }
};

export const getPackageById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const packageId = parseInt(req.params.id, 10);
    // Extraemos el código de idioma de la query string (ej: ?lang=fr)
    const languageCode = req.query.lang as string | undefined;

    const tvPackage = await packageService.getPackageById(
      packageId,
      languageCode
    );
    res.status(200).json(tvPackage);
  } catch (error) {
    next(error);
  }
};

