#!/bin/bash
wget --spider --timeout=30 --tries=1 http://localhost:8080 >/dev/null 2>&1
result=$? datetime=$(date) subject="My Subject"
recipients="email@example.com"
if [[ $result != 0 ]]; then
    echo "$datetime: Tomcat is down ($result)"
    echo -e "\tAttempting to restart Tomcat server..."
    /bin/bash /usr/share/tomcat7/bin/shutdown.sh >/dev/null 2>&1
    /bin/bash /usr/share/tomcat7/bin/startup.sh >/dev/null 2>&1
    restart_result=$?
    if [[ $restart_result != 0 ]]; then
        echo -e "\tTomcat could not be restarted!"
        echo -e "\tSendind email..."
        mail -s "$subject" $recipients < /my/path/wrongrestart.txt >/dev/null 2>&1
        echo -e "\tDone!"
    else
        echo -e "\tTomcat restarted successfully!"
        echo -e "\tSending email..."
        mail -s "$subject" $recipients < /my/path/successrestart.txt >/dev/null 2>&1
        echo -e "\tDone!"
    fi else
    echo "$datetime: Tomcat is up"
fi
