Script to check wether tomcat server is up or not. To execute as a cron job every 7 minutes add the following line to your crontab file (putting the appropriate paths, ports... in the files):
```bash
*/7 * * * * /my/path/tomcatChecker.sh >> /my/path/log.txt
```
