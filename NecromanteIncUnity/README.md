# Necromante Inc. para Unity

Port em C# da branch `graveyard-incremental-game` do repositório MecTrap/Jogo-incremental, no commit `91656b1`.

## Como jogar

1. No Unity Hub, escolha **Add > Add project from disk** e selecione a pasta `NecromanteIncUnity`.
2. Abra o projeto com a Unity **6000.6.8f1**.
3. Na janela **Project**, abra **Assets > Scenes > Necromante** e pressione **Play**.
4. No menu, clique em **Jogar**. Conjure 15 vezes no Cemitério para comprar seu primeiro Esqueleto. Ele começa a produzir ouro.

Para gerar um executável, abra **File > Build Profiles**, selecione a plataforma com o módulo instalado e clique em **Build**. A cena principal já está na lista de cenas.

## Onde editar

- `Assets/Scripts/Game.cs` reúne as regras de produção, compras, evolução, XP, missões e conquistas.
- `Assets/Scripts/NecromanteUI.cs` monta a interface no UI Toolkit e controla som e salvamento.
- `Assets/Resources/GameTheme.uss` define a aparência. Os dois fundos são os da versão original.
- `Assets/Resources/Catalog.json` contém nomes, descrições e valores de balanceamento. Mantenha a ordem das listas de monstros, estações e automação ao editar um projeto com progresso salvo.

O progresso é salvo localmente pela Unity. A produção offline usa as taxas atuais do jogo, com limite de 12 horas. Os saves da versão de navegador ficam no armazenamento do navegador.

Os bônus gerais do Acampamento e do Portal se aplicam à produção e à conjuração nesta versão, conforme as descrições dessas estações.
