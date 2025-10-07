import multer from 'multer';
import {BadRequestError} from '../utils/errors';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new BadRequestError('Not an image! Please upload an image file'));
    }
}

const limits = {
    fileSize: 1024 * 1024 * 5 // 5MB
}

export const upload = multer({storage, fileFilter, limits});
