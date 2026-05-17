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

    /*
     * Quorum queues vs classic mirrored queues:
     *   - Classic mirrored is deprecated in RabbitMQ 4.x.
     *   - Quorum queues replicate via Raft → no message loss on broker
     *     restart even mid-publish, predictable failover.
     *   - Trade-off: ~10× the on-disk footprint and slightly higher
     *     publish latency. Worth it for "must-not-lose" workloads like
     *     a paid CV analysis job.
     * Lazy mode keeps messages on disk instead of memory — good for our
     * spiky workload where a burst of uploads could OOM the broker.
     *
     * MIGRATION NOTE: you cannot change a queue's type in place. If you
     * deploy this against a broker that already has the classic
     * versions, the startup will fail with PRECONDITION_FAILED. Drain
     * the old queues and delete them first:
     *   rabbitmqctl delete_queue analysis.run
     *   rabbitmqctl delete_queue analysis.complete
     */

    @Bean
    public Queue analysisRunQueue() {
        return QueueBuilder.durable(ANALYSIS_RUN_QUEUE)
                .quorum()
                .lazy()
                .build();
    }

    @Bean
    public Queue analysisCompleteQueue() {
        return QueueBuilder.durable(ANALYSIS_COMPLETE_QUEUE)
                .quorum()
                .lazy()
                .build();
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
