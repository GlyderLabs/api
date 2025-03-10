import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import process from 'process';
import path from 'path'

const storage = multer.diskStorage({
    async destination(req:any, file:any, cb:any) {
        const dir = req.body.dir
      const directory = `${process.cwd()}/src/temp/${dir}`;
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      cb(null, directory);
    },
    async filename(req, file, cb) {
      const id = uuidv4()
      //first remove the file extension form file.originalname
      const filename = file.originalname;
      cb(null, filename);
    },
});
  
export const uploadFile = multer({
    storage: storage,
    //limits: { fileSize: (1024 * 1024)}, // 1kb
  }).array('items');