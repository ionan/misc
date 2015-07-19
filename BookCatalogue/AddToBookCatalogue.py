#!/usr/bin/python
# coding=utf-8
import os
import sqlite3
import Image
import uuid
import csv
import ConfigParser

config = ConfigParser.RawConfigParser()
config.read('BookCatalogue.properties')
dbPath = config.get('General', 'dbPath')
outputFolder = config.get('General', 'outputFolder')
excludeGenreNames = config.get('General', 'excludeGenreNames').split(',')

connection = sqlite3.connect(dbPath + 'metadata.db')
connection.text_factory = str
cursor = connection.cursor()

myfile = open(outputFolder + 'myfile.csv','wb')
wr = csv.writer(myfile, quoting=csv.QUOTE_ALL)

errorFile = open(outputFolder + "error.txt", "w")

baseSQL = """select title, l.book, author, name, ##ACC## as accuracy, ba.id, path, l.lang_code, b.uuid from
		  books b inner join books_authors_link ba on b.id = ba.book inner join authors a on ba.author = a.id
 		  inner join books_languages_link l on b.id = l.book where lower(title) like '%##ST##%' or lower(name) like  '%##ST##%'"""

infoSQL = """select text as description,value as numberOfPages, tags from (select book, text from comments where book = ##BID##) a
		inner join 
		(select book, value from custom_column_2 where book = ##BID##) b
		on a.book = b.book 
		inner join
		(select book, group_concat(tag,'; ') as tags from books_tags_link group by book order by book) c
		on a.book = c.book  """

language = {}
tags = {}

def insertBooks(books):
	book_id = 0

	for book in books:
		try:
			book_id = book_id + 1

			if book_id % 500 == 0:
				global myfile
				global wr
				myfile = open(outputFolder + 'myfile_'+ str(book_id / 500) + '.csv','wb')
				wr = csv.writer(myfile, quoting=csv.QUOTE_ALL)
				wr.writerow(["_id","author_details","title","isbn","publisher","date_published","rating","bookshelf_id","bookshelf","read","series_details","pages","notes","list_price","anthology","location","read_start","read_end","format","signed","loaned_to","anthology_titles","description","genre","language","date_added","goodreads_book_id","last_goodreads_sync_date","last_update_date","book_uuid"]
)
		
			code = book["uuid"].replace("-","") #uuid.uuid1().hex
		
			print '\tAñadiendo ' +  book['book'] + ', de ' + book['author'] + '...'
			lcName = None
			famName = None
			description = None
			pages = None
			genres = None
		
			_sql = infoSQL.replace('##BID##',str(book['book_id']))
			cursor.execute(_sql)
			for row in cursor:
				description = row[0].replace('<p class="description">','').replace('</p>','').replace('\n',' ')
				pages = row[1]
				genres = row[2]
				break
			
			#INSERT BOOK
			imgPath = dbPath + book['path'] + '/cover.jpg'
			imgBaseName = code
			xlSize = 256,390
			lSize = 128,195
			sSize = 53,80
			largeImgName = imgBaseName
			smallImgName = imgBaseName
			im = Image.open(imgPath)
			im.thumbnail(xlSize, Image.ANTIALIAS)
			im.save(outputFolder + "thumbnails/" + imgBaseName + ".jpg", "JPEG")
			#im.thumbnail(sSize, Image.ANTIALIAS)
			#im.save(outputFolder + "thumbnails/" + imgBaseName + '_small', "PNG")

			genreNames = ''
			genreIds = ''	
			first = True	
			if genres != None:
				genresSplit = genres.split(';')
				for genre in genresSplit:
					genreName = tags[genre.strip()]
					if genreName in excludeGenreNames:
						continue
					if first:
						genreNames = genreName
						genreIds = genre.strip()
						first = False
					else:
						genreNames = genreNames + "," + genreName
						genreIds = genreIds + "," + genre.strip()
		
			wr.writerow([book['book_id'],book["author"],book['book'],'','','','',genreIds,genreNames,'0','',pages,'','','','','','','','','','',description,genreNames.replace(',',' / '),'Spanish','','','','',code])
			print '\tAñadido!'
		except Exception, e:
			errorFile.write('\tError: ' + str(e) + ' (' + book['book'] + ', de ' + book['author']+ ')')

def initTags():
	sql = "select id, name from tags"
	cursor.execute(sql)
	for row in cursor:
		tags[str(row[0])] = row[1]

def initLanguages():
	language[1] = 'ES'
	language[2] = '??'
	language[3] = 'EN'
	language[4] = 'IT'
	language[5] = 'FR'
	language[6] = '??'
	
def main():
	initLanguages()
	initTags()
	
	resultDict = {}
	resultArr =[]
	
	
	wr.writerow(["_id","author_details","title","isbn","publisher","date_published","rating","bookshelf_id","bookshelf","read","series_details","pages","notes","list_price","anthology","location","read_start","read_end","format","signed","loaned_to","anthology_titles","description","genre","language","date_added","goodreads_book_id","last_goodreads_sync_date","last_update_date","book_uuid"]
)

	mysql = """select title, l.book, author, a.sort, 0 as accuracy, ba.id, path, l.lang_code, b.uuid from
		  books b inner join books_authors_link ba on b.id = ba.book inner join authors a on ba.author = a.id
 		  inner join books_languages_link l on b.id = l.book inner join (select book from custom_column_8 where value = 1) btl on btl.book = 	b.id and b.id in (select book from (select count (*) tot, book from books_authors_link group by book order by 1 desc) where tot < 3) 
order by ba.id"""
 	
 	cursor.execute(mysql)

	for row in cursor:
		if row[5] not in resultDict:
			simpleResult = {}
			simpleResult['book'] = row[0]
			simpleResult['book_id'] = row[1]
			simpleResult['author'] = row[3]
			simpleResult['author_id'] = row[2]
			simpleResult['path'] = row[6]
			simpleResult['lang'] = row[7]
			simpleResult['uuid'] = row[8]
			resultArr.append(simpleResult)
			resultDict[row[5]] = 1
	
	insertBooks(resultArr)

main()
