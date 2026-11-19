# Necromante Inc. para Unity

Port em C# da branch `graveyard-incremental-game` do repositório MecTrap/Jogo-incremental, no commit `91656b1`.

## Como jogar

1. No Unity Hub, escolha **Add > Add project from disk** e selecione a pasta `NecromanteIncUnity`.
2. Abra o projeto com a Unity **6000.6.8f1**.
3. Na janela **Project**, abra **Assets > Scenes > Necromante** e pressione **Play**.
4. No menu, clique em **Jogar**. Conjure 25 vezes no Cemitério para comprar seu primeiro Esqueleto. Ele começa a produzir ouro.

Para gerar um executável, abra **File > Build Profiles**, selecione a plataforma com o módulo instalado e clique em **Build**. A cena principal já está na lista de cenas.

## Onde editar

- `Assets/Scripts/Game.cs` reúne as regras de produção, compras, evolução, XP, missões e conquistas.
- `Assets/Scripts/NecromanteUI.cs` monta a interface no UI Toolkit e controla som e salvamento.
- `Assets/Resources/GameTheme.uss` define a aparência. Os dois fundos são os da versão original.
- `Assets/Resources/Catalog.json` contém nomes, descrições e valores de balanceamento. Mantenha a ordem das listas de monstros, estações e automação ao editar um projeto com progresso salvo.

O progresso é salvo localmente pela Unity. A produção offline usa as taxas atuais do jogo, com limite de 12 horas. Os saves da versão de navegador ficam no armazenamento do navegador.

Os bônus gerais do Acampamento e do Portal se aplicam à produção e à conjuração nesta versão, conforme as descrições dessas estações.

## Aprimoramentos das estruturas

Na aba **Estações**, selecione uma estrutura e abra seus aprimoramentos. Cada uma tem duas etapas com duas melhorias de produção e uma evolução visual por etapa. As duas melhorias podem ser compradas em qualquer ordem. A evolução é liberada depois de comprar ambas.

Cada estação progride de forma independente. Os custos usam ouro e ossos e passam a exigir essência na segunda etapa. Os bônus se acumulam com os níveis da estação.

O Acampamento começa como uma fogueira, evolui para um caldeirão e depois recebe uma carroça. Cemitério, Cripta, Forja, Torre e Portal também têm três aparências próprias, visíveis no mapa e no painel.

Saves anteriores mantêm os níveis e recursos já adquiridos e começam com os novos aprimoramentos disponíveis para compra.

## Prestígio e progressão

O botão **Prestígio** mostra a recompensa e permite renascer a partir do **nível 10**. Cada **Alma Eterna** acumulada concede **+10% de geração permanente**, somado aos bônus das outras almas. Esse multiplicador vale para ouro, ossos, essência, conjuração manual, automação e produção offline.

O renascimento exige confirmação e reinicia os recursos, nível, XP, criaturas, estações, melhorias, automação e missões do ciclo. As Almas Eternas, a quantidade de renascimentos e as configurações de som são preservadas. A opção **Redefinir progresso** apaga também o prestígio.

A recompensa parte de uma alma, cresce gradualmente com o ouro produzido no ciclo e aumenta a cada cinco níveis acima do nível 10. Os custos das compras e a curva de XP foram elevados para alongar o desenvolvimento do reino.

Em uma simulação com dois cliques por segundo e compras frequentes por eficiência, o primeiro Necromante chegou em aproximadamente 38 minutos, a primeira evolução de estrutura em 19 minutos e o primeiro prestígio em 70 minutos. Esses tempos variam com a frequência dos cliques, as compras escolhidas e o tempo offline. Saves antigos conservam os recursos e itens já adquiridos e passam a usar os novos custos nas próximas compras.
