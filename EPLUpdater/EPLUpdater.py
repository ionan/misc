#!/usr/bin/python
# coding=utf-8

import os
import sys
import sqlite3
import csv
import xml.etree.cElementTree as ET
from subprocess import call
import ConfigParser

csvpath = "epublibre.csv"
calibrePath = "metadata.db"
torrentsPath = "Torrents/"

connection = sqlite3.connect(calibrePath)
connection.text_factory = str
cursor = connection.cursor()

biblioteca = ET.Element("Biblioteca")
novedades = ET.SubElement(biblioteca,"Novedades")
actualizaciones = ET.SubElement(biblioteca,"Actualizaciones")

maxRecords = 3000 #sys.maxint
offset = 0
updates = False
newBooks = False
mock = False

def writeProgress(new,upd):
    sys.stdout.write("\r" + str(new) + " books will be added; " + str(upd) + " books will be updated")
    sys.stdout.flush()

def addTorrent(epg_id,magnet):
    if not mock:
        os.system("deluge-console 'add -p \"" + torrentsPath + epg_id + "/\" \"magnet:?xt=urn:btih:" + magnet.split(',')[0] + "\"' > /dev/null")

def addBook(row,libro):
    titulo = ET.SubElement(libro, "Titulo")
    titulo.text = row[1].decode("utf-8")
    autores = ET.SubElement(libro, "Autores")
    autores.text = row[2].decode("utf-8")
    version = ET.SubElement(libro, "Version")
    version.text = row[9].decode("utf-8")
    if row[4] != "":
        serie = ET.SubElement(libro, "Serie")
        serie.text = row[4].decode("utf-8") + " #" + row[5]
    version = ET.SubElement(libro, "Paginas")
    version.text = row[8].decode("utf-8")
    version = ET.SubElement(libro, "Publicado")
    version.text = row[6].decode("utf-8")
    version = ET.SubElement(libro, "Estado")
    version.text = row[12].decode("utf-8")
    version = ET.SubElement(libro, "Valoracion")
    version.text = row[13].decode("utf-8")

def findNewBooks():
    index = 0
    new = 0
    upd = 0
    for row in csv_f:
        if new + upd >= maxRecords + offset:
            break
        index = index + 1
        if row[10] != "Español":
            continue
        if index == 1:
            continue
        epg_id = "1" + "%07d" % int(row[0])
        cursor.execute("select book from custom_column_4 where value = ?",[epg_id])
        result = cursor.fetchone()

        if newBooks and result == None:
            new = new + 1
            if new + upd > offset:
                libro = ET.SubElement(novedades, "Libro")
                libro.set("epg_id", epg_id + ".0")
                addBook(row,libro)
                try:
                    addTorrent(epg_id,row[15])
                except:
                    #print row[0] + " could not be added due to an error!\n"
                    pass
            #else:
                #print row[0] + " not added due to the offset!\n"
        elif updates and result != None:
            cursor.execute("select b.value from books_custom_column_5_link a inner join custom_column_5 b on a.value = b.id  where book = ?",[result[0]])
            result = cursor.fetchone()
            if result != None and float(result[0]) != float(row[9]):
                upd = upd + 1
                if new + upd > offset:
                    libro = ET.SubElement(actualizaciones, "Libro")
                    libro.set("epg_id", epg_id + ".0")
                    addBook(row,libro)
                    try:
                        addTorrent(epg_id,row[15])
                    except:
                        #print row[0] + " could not be added due to an error!\n"
                        pass
                #else:
                #    print row[0] + " not added due to the offset!\n"
        writeProgress(new,upd)

    novedades.set("total", str(new))
    actualizaciones.set("total", str(upd))

    indent(biblioteca)
    ntree = ET.ElementTree(biblioteca)
    ntree.write("Actualizacion_EPG.xml")

    print ""

def indent(elem, level=0):
    i = "\n" + level*"  "
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
        for elem in elem:
            indent(elem, level+1)
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = i

def main():
	findNewBooks()

#Parse command line arguments
for arg in sys.argv:
	if arg.startswith('-'):
		new = 'n' in arg
		updates = 'u' in arg
		mock = 'm' in arg
	elif arg.startswith('l'):
		maxRecords = int(arg[1:])
	elif arg.startswith('o'):
		offset = int(arg[1:])

#Read properties
config = ConfigParser.RawConfigParser()
config.read('EPLUpdater.properties')
calibrePath = config.get('General', 'dbPath')
torrentsPath = config.get('General', 'torrentsPath')
csvpath = config.get('General', 'csvPath')

myfile = open(csvpath)
csv_f = csv.reader(myfile)
   
main()
