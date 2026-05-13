package com.cvplatform.analysis.queue;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String ANALYSIS_RUN_QUEUE = "analysis.run";
    public static final String ANALYSIS_COMPLETE_QUEUE = "analysis.complete";

    @Bean
    public Queue analysisRunQueue() {
        return QueueBuilder.durable(ANALYSIS_RUN_QUEUE).build();
    }

    @Bean
    public Queue analysisCompleteQueue() {
        return QueueBuilder.durable(ANALYSIS_COMPLETE_QUEUE).build();
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter conv) {
        RabbitTemplate t = new RabbitTemplate(cf);
        t.setMessageConverter(conv);
        return t;
    }
}
