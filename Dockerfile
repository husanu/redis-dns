# DNS server on top of redis
#
# VERSION               0.0.1

FROM       ubuntu:latest

# Format: MAINTAINER Name <email@addr.ess>
MAINTAINER Jonas Colmsjö <jonas@gizur.com>

RUN echo "export HOME=/root" >> /root/.profile

RUN apt-get update
RUN apt-get install -y wget nano curl git


#
# Install supervisord (used to handle processes)
# ----------------------------------------------
#
# Installation with easy_install is more reliable. apt-get don't always work.

RUN apt-get install -y python python-setuptools
RUN easy_install supervisor

ADD ./src-docker/etc-supervisord.conf /etc/supervisord.conf
ADD ./src-docker/etc-supervisor-conf.d-supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN mkdir -p /var/log/supervisor/


#
# Install NodeJS
# --------------

RUN apt-get install -y build-essential g++

RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.13.1/install.sh | bash
# RUN echo "[ -s $HOME/.nvm/nvm.sh ] && . $HOME/.nvm/nvm.sh" >> $HOME/.profile
RUN /bin/bash -c "source $HOME/.profile && nvm install v0.10.33"

ADD ./src-docker/init-node.sh /
RUN ./init-node.sh

ADD ./bin/start.sh /


#
# Install Redis
# -------------

RUN apt-get install -y redis-server


#
# Add source for the redis-dns server
# ------------------------------------

ADD ./package.json /
ADD ./bin/start.sh /bin
ADD ./server.js /server.js
ADD ./redis-dns-config.json /

RUN cd /; npm install --production


#
# Start things
# -----------

# RUN apt-get clean && rm -rf /var/lib/apt/lists/*


EXPOSE 5353

ADD ./src-docker/start-supervisor.sh /start-supervisor.sh
CMD ["/start-supervisor.sh"]
