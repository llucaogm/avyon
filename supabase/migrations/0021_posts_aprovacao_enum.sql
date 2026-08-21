create type post_aprovacao as enum ('esperando', 'aprovado', 'reprovado');

alter table posts add column aprovacao post_aprovacao not null default 'esperando';
update posts set aprovacao = case when aprovado then 'aprovado'::post_aprovacao else 'esperando'::post_aprovacao end;
alter table posts drop column aprovado;
