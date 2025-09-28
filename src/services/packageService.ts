import {Package} from '../models/Package';
import Channel from '../models/Channel';
import {NotFoundError} from '../utils/errors';

export const getAllPackages = async ():Promise<Package[]> =>{
    return Package.findAll();
}

export const getPackageById = async (packageId:number): Promise<Package> => {
    const tvPackage = await Package.findByPk(packageId,{
        include:{
            model: Channel,
            as: 'channels',
            through: {attributes: []},
        }
    });
    if (!tvPackage) {
        throw new NotFoundError(`Package with id ${packageId} not found`);
    }
    return tvPackage;
}