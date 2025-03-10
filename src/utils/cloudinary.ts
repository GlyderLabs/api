/* eslint-disable no-undef */
import dotenv from "dotenv"
import { UpdateApiOptions, v2 } from "cloudinary";

v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dhzsjb5ya',
    api_key: process.env.CLOUDINARY_API_KEY || '852198597739393',
    api_secret: process.env.CLOUDINARY_API_KEY || "rroJgk6ygoQrT7P4qwH_XTW-c-0"
});

class CloudinaryManager {
    cloudinary
    constructor() {
        this.cloudinary = v2;
    }
    /**
     * Uploads a file to Cloudinary
     * @param {string} file - The file to upload
     * @param {object} options - The upload options
     * @returns {object} The upload result
     */
    async upload(file:any, options:any): Promise<UpdateApiOptions>{
        if (!options) {
            options = {};
        }
        if (!options.folder) {
            options.folder = 'uploads';
        }
        return new Promise((resolve, reject) => {
            this.cloudinary.uploader.upload(file,options, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    /**
     * Destroys a file on Cloudinary
     * @param {string} publicId - The public ID of the file
     * @param {object} options - The destroy options
     * @returns {object} The destroy result
     */
    async destroy(publicId:any, options:any) {
        return new Promise((resolve, reject) => {
            this.cloudinary.uploader.destroy(publicId, options, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    /**
     * Resolve a file from Cloudinary
     * @param {string} publicId - The public ID of the file
     * @param {object} options - The resolveFileByPublicId options
     * @returns {object} The resolveFileByPublicId result
     * @example
     * const cloudinaryManager = new CloudinaryManager();
     * const result = await cloudinaryManager.resolveFileByPublicId('l0vh9xamfhhmtzhjzwxr');
     * logger.info(result);
     *  {
            asset_id: '5a5a1fb012ff260401042b9a5201ab3c',
            public_id: 'l0vh9xamfhhmtzhjzwxr',
            format: 'png',
            version: 1695874155,
            resource_type: 'image',
            type: 'upload',
            created_at: '2023-09-28T04:09:15Z',
            bytes: 50858,
            width: 160,
            height: 178,
            folder: '',
            access_mode: 'public',
            url: 'http://res.cloudinary.com/lexium-enterprise/image/upload/v1695874155/l0vh9xamfhhmtzhjzwxr.png',
            secure_url: 'https://res.cloudinary.com/lexium-enterprise/image/upload/v1695874155/l0vh9xamfhhmtzhjzwxr.png',
            next_cursor: 'bd21f33cccc326cbc531497d446c7e261e3a5e77d4f15ad2d11ab614ba542e9c',
            derived: [],
            rate_limit_allowed: 500,
            rate_limit_reset_at: 2024-01-10T15:00:00.000Z,
            rate_limit_remaining: 473
        }
     */
    async resolveFileByPublicId(publicId:any, options:any) {
        return new Promise((resolve, reject) => {
            this.cloudinary.api.resource(publicId, options, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }
}



export default CloudinaryManager;


