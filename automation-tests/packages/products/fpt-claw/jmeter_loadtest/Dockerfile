FROM eclipse-temurin:11-jre

# Download and install JMeter 5.6.3
RUN wget -q https://downloads.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz && \
    tar -xzf apache-jmeter-5.6.3.tgz && \
    rm apache-jmeter-5.6.3.tgz && \
    mv apache-jmeter-5.6.3 /opt/jmeter

ENV JMETER_HOME /opt/jmeter
ENV PATH $JMETER_HOME/bin:$PATH

WORKDIR /tests

CMD ["jmeter"]
