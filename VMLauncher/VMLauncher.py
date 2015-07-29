from datetime import datetime, timedelta
import time
from subprocess import call
import ConfigParser
import sys

vboxpath = None
config = None
section = 'Main'
vboxpath = None
vboxname = None
snapshotname = None
days = None
lastexec = 0
sleepS = 0

def restoreRequired():
	today = datetime.utcfromtimestamp(time.time())
	lastday = datetime.utcfromtimestamp(lastexec)
	return (today - lastday).days > days
	
def restore():
	call([vboxpath + "VBoxManage.exe", "snapshot", vboxname, "restore", snapshotname])
	config.set(section,'lastexec',str(int(time.time())))
	with open(r'VMLauncher.properties', 'wb') as configfile:
		config.write(configfile)
	
def main():
	if restoreRequired():
		restore()
	call([vboxpath + "VBoxManage.exe", "startvm", vboxname])
	
try:		
	for arg in sys.argv:
		if arg.startswith('--'):
			section = arg[2:]
	config = ConfigParser.RawConfigParser()
	config.read('VMLauncher.properties')	
	vboxpath = config.get('Main', 'vboxpath')
	sleepS = int(config.get('Main', 'sleep'))
	vboxname = config.get(section, 'vm')
	snapshotname = config.get(section, 'snapshot')
	days = int(config.get(section, 'days'))
	lastexec = int(config.get(section, 'lastexec'))
except:
	if sleepS > 0:
		time.sleep(sleepS)
	exit()

main()

if sleepS > 0:
	time.sleep(sleepS)