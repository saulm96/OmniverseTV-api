import {Request, Response, NextFunction} from 'express';
import * as packageService from '../services/packageService';

export const getAllPackages = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const packages = await packageService.getAllPackages();
        res.status(200).json(packages);
    } catch (error) {
        next(error);
    }
}

export const getPackageById = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const packageId = parseInt(req.params.id);
        const tvPackage = await packageService.getPackageById(packageId);
        res.status(200).json(tvPackage);
    } catch (error) {
        next(error);
    }
}

