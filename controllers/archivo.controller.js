import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { uploadDir } from "../config/multer.js";
import { ok, fail } from "../utils/response.js";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error Fatal: Faltan las variables de entorno SUPABASE_URL o SUPABASE_KEY en archivo.controller.js.");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'archivos-expedientes'; 


export const descargarArchivo = async (req, res) => {
  try {
    console.log(`(archivo.controller) Iniciando descarga de archivo ID: ${req.params.id}`);
    const r = await pool.query("SELECT * FROM archivos WHERE id=$1", [req.params.id]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado en la BD");

    const file = r.rows[0];
    
    
    const supabaseUrl = file.archivo_path; 

    if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
      return fail(res, 400, "El path del archivo no es una URL de Supabase válida.");
    }
    
    console.log(`Archivo encontrado en BD. URL de Supabase: ${supabaseUrl}`);

    
    const fileResponse = await fetch(supabaseUrl);

    if (!fileResponse.ok) {
      throw new Error(`Supabase falló al descargar el archivo (Status: ${fileResponse.status})`);
    }


    const fileBuffer = await fileResponse.arrayBuffer();

    res.setHeader('Content-Disposition', `attachment; filename="${file.nombre_original}"`);
    res.setHeader('Content-Type', 'application/pdf');
 
    console.log(`Enviando archivo "${file.nombre_original}" al usuario.`);
    res.send(Buffer.from(fileBuffer));

  } catch (err) {
    console.error("Error crítico en descargarArchivo:", err.message);
    fail(res, 500, err.message);
  }
};


export const eliminarArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`(archivo.controller) Iniciando eliminación de archivo ID: ${id}`);
    
    const r = await pool.query("DELETE FROM archivos WHERE id=$1 RETURNING *", [id]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado en BD");

    const archivoBorrado = r.rows[0];
    console.log(`Archivo borrado de la BD: ${archivoBorrado.nombre_original}`);

    if (archivoBorrado.archivo_path.includes('supabase.co')) {
      try {
       
        const nombreArchivoSupabase = archivoBorrado.archivo_path.split('/').pop();
        
        console.log(`Borrando de Supabase: ${nombreArchivoSupabase}`);
        await supabase.storage.from(BUCKET_NAME).remove([nombreArchivoSupabase]);
        console.log(`Archivo borrado de Supabase.`);

      } catch (e) {
        console.warn("No se pudo borrar el archivo de Supabase:", e.message);
      }
    }

    ok(res, { archivo: archivoBorrado });
  } catch (err) {
    console.error("Error crítico en eliminarArchivo:", err.message);
    fail(res, 500, err.message);
  }
};
