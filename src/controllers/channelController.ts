import { Request, Response, NextFunction } from "express";
import * as channelService from '../services/channelService';

export const getChannelById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const channelId = parseInt(req.params.id, 10);
        // Extraemos el código de idioma de la query string (ej: ?lang=fr)
        const languageCode = req.query.lang as string | undefined;

        const channel = await channelService.getChannelById(
            channelId,
            languageCode
        );
        res.status(200).json(channel);
    } catch (error) {
        next(error);
    }
};